/* eslint-disable object-curly-spacing */
/* eslint-disable semi */
/* eslint-disable @typescript-eslint/indent */
import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as r53 from 'aws-cdk-lib/aws-route53';
import * as r53Targets from 'aws-cdk-lib/aws-route53-targets';

import {Construct} from 'constructs';
import {DockerizedApp} from '../constructs/ecs/dockerizedApp';
import {AppHostingStackProps} from './schemas/app-hosting-stack.schema';

export class AppHostingStack extends cdk.Stack {
  private props: AppHostingStackProps;
  private farGateCluster: ecs.Cluster;
  private dockerizedApp: DockerizedApp;
  private loadBalancer: elbv2.ApplicationLoadBalancer;
  private loadBalancerSg: ec2.SecurityGroup;
  private containerSg: ec2.SecurityGroup;
  private loadBalancerCertificate: acm.Certificate;
  private listener443: elbv2.ApplicationListener;
  private appPort = 3000;
  constructor(scope: Construct, id: string, props: AppHostingStackProps) {
    super(scope, id, props);
    this.props = props;

    //this.createAccountWideServiceRoles()
    this.createFargetCluster();
    this.createNetworkConfiguration();
    this.createApp();
    this.createLoadBalancer();
    this.createUserFriendlyUrl();
  }

  // If this stack is deployed in a account seperate from Platform, then we need to create the account wide service roles.
  //private createAccountWideServiceRoles() {
  //  this.ecsRole = new iam.CfnServiceLinkedRole(this, 'EcsSlr', {
  //    awsServiceName: 'ecs.amazonaws.com',
  //    description: 'This is an account wide service linked role for ECS. That must exists for ECS to work. Can only exist once per AWS account.',
  //  })
  //}

  private createFargetCluster() {
    this.farGateCluster = new ecs.Cluster(this, 'farGateCluster', {
      vpc: this.props.vpc,
      enableFargateCapacityProviders: true,
    });
    //this.farGateCluster.node.addDependency(this.ecsRole)
  }

  private createNetworkConfiguration() {
    this.containerSg = new ec2.SecurityGroup(this, 'containerSg', {
      vpc: this.props.vpc,
      allowAllOutbound: true,
    });
    this.loadBalancerSg = new ec2.SecurityGroup(this, 'loadBalancerSg', {
      vpc: this.props.vpc,
      allowAllOutbound: false,
    });
    this.loadBalancerSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTP traffic from anywhere',
    );
    this.loadBalancerSg.addEgressRule(
      ec2.Peer.securityGroupId(this.containerSg.securityGroupId),
      ec2.Port.tcp(this.appPort),
      'Allow HTTP traffic to container',
    );
    this.containerSg.addIngressRule(
      this.loadBalancerSg,
      ec2.Port.tcp(this.appPort),
      'Allow HTTP traffic from loadbalancer',
    );
    this.containerSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.allTraffic(),
      'Allow HTTP traffic from anywhere',
    );
  }

  private createApp() {
    this.dockerizedApp = new DockerizedApp(this, 'OEEIntelligenceApp', {
      vpc: this.props.vpc,
      subnets: this.props.tier1Subnets,
      securityGroup: this.containerSg,
      cluster: this.farGateCluster,
      //   image: ecs.ContainerImage.fromRegistry(
      //     'public.ecr.aws/ecs-sample-image/amazon-ecs-sample:latest',
      //   ),
      image: ecs.ContainerImage.fromAsset('../app'),
      appPort: this.appPort,
    });
  }

  private createLoadBalancer() {
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      'LoadBalancer',
      {
        vpc: this.props.vpc,
        internetFacing: false,
        vpcSubnets: {
          subnets: this.props.tier1Subnets,
        },
        securityGroup: this.loadBalancerSg,
      },
    );

    this.loadBalancer.addRedirect({
      sourceProtocol: elbv2.ApplicationProtocol.HTTP,
      sourcePort: 80,
      targetProtocol: elbv2.ApplicationProtocol.HTTPS,
      targetPort: 443,
    });

    this.loadBalancerCertificate = new acm.PrivateCertificate(
      this,
      'certficate',
      {
        domainName: this.props.hostedZone.zoneName,
        subjectAlternativeNames: [this.loadBalancer.loadBalancerDnsName],
        certificateAuthority: this.props.certificateAuthority,
      },
    );

    this.listener443 = this.loadBalancer.addListener('listener443', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [this.loadBalancerCertificate],
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {}),
      sslPolicy: elbv2.SslPolicy.RECOMMENDED_TLS,
    });
  }

  private createUserFriendlyUrl() {
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'targetGroup', {
      port: this.appPort,
      vpc: this.props.vpc,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        protocol: elbv2.Protocol.HTTP,
        port: this.appPort.toString(),
        path: '/',
        healthyHttpCodes: '200',
      },
    });
    new elbv2.ApplicationListenerRule(this, 'rule', {
      priority: 1,
      conditions: [
        elbv2.ListenerCondition.hostHeaders([this.props.hostedZone.zoneName]),
      ],
      listener: this.listener443,
      targetGroups: [targetGroup],
    });
    this.dockerizedApp.service.attachToApplicationTargetGroup(targetGroup);

    new r53.ARecord(this, 'arecord', {
      zone: this.props.hostedZone,
      target: r53.RecordTarget.fromAlias(
        new r53Targets.LoadBalancerTarget(this.loadBalancer),
      ),
    });
  }
}
