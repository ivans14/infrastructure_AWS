import { Construct } from 'constructs'
import { GitoCustomRessourceLambda } from '../lambda/gito-custom-resource-lambda'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as iam from 'aws-cdk-lib/aws-iam'

/**
 * Retrieves the IP Adresses for a single VPC Endpoint
 */
export interface VpcEndPointIpsProps {
  vpcEndpoint: ec2.IInterfaceVpcEndpoint | ec2.GatewayVpcEndpoint
  vpc: ec2.IVpc
  securityGroup: ec2.SecurityGroup
}

export class VpcEndPointIps extends Construct {
  private props: VpcEndPointIpsProps
  private customLambda: GitoCustomRessourceLambda
  public numberOfIps: string
  public vpcEndPointIp0?: string
  public vpcEndPointIp1?: string
  public vpcEndPointIp2?: string
  public vpcEndPointIp3?: string
  constructor(scope: Construct, id: string, props: VpcEndPointIpsProps) {
    super(scope, id)

    this.props = props
    this.createCustomLambda()
  }

  /**
   * Creates custom ressource to deploy user to database
   */
  private createCustomLambda() {
    this.customLambda = new GitoCustomRessourceLambda(this, 'vpce-ip', {
      vpc: this.props.vpc,
      lambdaSgs: [this.props.securityGroup],
      options: {
        environment: {
          vpcEndpointId: this.props.vpcEndpoint.vpcEndpointId,
        },
        memorySize: 128,
        timeout: cdk.Duration.seconds(60),
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: './lib/constructs/vpc/src/vpc-endpoint-ips.ts',
      },
      additionalPolicyStatements: [
        new iam.PolicyStatement({
          resources: ['*'],
          actions: [
            'ec2:CreateNetworkInterface',
            'ec2:DescribeVpcEndpoints',
            'ec2:DescribeNetworkInterfaces',
            'ec2:DeleteNetworkInterface',
          ],
        }),
      ],
    })
    this.customLambda.node.addDependency(this.props.vpcEndpoint)

    this.numberOfIps = this.customLambda.customRessource.getAttString('numberOfIps')
    this.vpcEndPointIp0 = this.customLambda.customRessource.getAttString('vpcEndPointIp0')
    this.vpcEndPointIp1 = this.customLambda.customRessource.getAttString('vpcEndPointIp1')
    this.vpcEndPointIp2 = this.customLambda.customRessource.getAttString('vpcEndPointIp2')
    this.vpcEndPointIp3 = this.customLambda.customRessource.getAttString('vpcEndPointIp3')
  }
}
