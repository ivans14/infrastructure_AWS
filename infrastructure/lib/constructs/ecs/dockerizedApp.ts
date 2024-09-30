/* eslint-disable object-curly-spacing */
/* eslint-disable semi */
import {Construct} from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface DockerizedAppProps {
  vpc: ec2.IVpc;
  subnets: ec2.ISubnet[];
  securityGroup: ec2.ISecurityGroup;
  cluster: ecs.Cluster;
  image: ecs.ContainerImage;
  appPort: number;
  memory?: number;
  cpu?: number;
}

export class DockerizedApp extends Construct {
  private props: DockerizedAppProps;
  public service: ecs.FargateService;
  private taskDefinition: ecs.FargateTaskDefinition;
  private role: iam.Role;
  constructor(scope: Construct, id: string, props: DockerizedAppProps) {
    super(scope, id);
    this.props = props;

    this.createRole();
    this.createTaskDefinition();
    this.createService();
  }

  private createRole() {
    this.role = new iam.Role(this, 'ecsToEcrRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Granting ECS access to ECR',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy',
        ),
      ],
    });

    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudwatch:DescribeAlarmsForMetric',
          'cloudwatch:DescribeAlarmHistory',
          'cloudwatch:DescribeAlarms',
          'cloudwatch:ListMetrics',
          'cloudwatch:GetMetricStatistics',
          'cloudwatch:GetMetricData',
          'ec2:DescribeTags',
          'ec2:DescribeInstances',
          'ec2:DescribeRegions',
          'tag:GetResources',
        ],
        resources: ['*'],
      }),
    );
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:*'],
        resources: ['*'],
      }),
    );
  }

  private createTaskDefinition() {
    this.taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'taskDefinition',
      {
        memoryLimitMiB: this.props.memory || 512,
        cpu: this.props.cpu || 256,
        taskRole: this.role,
        executionRole: this.role,
      },
    );
    this.taskDefinition.addContainer('container', {
      image: this.props.image,
      portMappings: [{containerPort: this.props.appPort}],
      logging: new ecs.AwsLogDriver({
        streamPrefix: 'app',
      }),
    });
  }

  private createService() {
    this.service = new ecs.FargateService(this, 'service', {
      cluster: this.props.cluster,
      taskDefinition: this.taskDefinition,
      vpcSubnets: this.props.vpc.selectSubnets({subnets: this.props.subnets}),
      securityGroups: [this.props.securityGroup],
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 1,
        },
        {
          capacityProvider: 'FARGATE',
          weight: 1,
        },
      ],
    });
  }
}
