import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as acmpca from 'aws-cdk-lib/aws-acmpca'
import { Construct } from 'constructs'
import { VpcAndSubnets } from '../constructs/vpc/vpc-subnets'
import { GitoResourceStackProps } from './schemas/gito-resource-stack.schema'

export class GitoResourceStack extends cdk.Stack {
  public vpc: ec2.IVpc
  public tier1Subnets: ec2.ISubnet[]
  public hostedZone: route53.IHostedZone
  public certificateAuthority?: acmpca.ICertificateAuthority
  private props: GitoResourceStackProps
  constructor(
    scope: Construct,
    id: string,
    props: GitoResourceStackProps,
  ) {
    super(scope, id, props)
    this.props = props
    this.getVpcAndSubnets()
    this.lookUpAccountHostedZone()
    this.lookUpCertificateAuthority()
    return this
  }

  private lookUpCertificateAuthority() {
    if (this.props.certificateManagerArn) {
      this.certificateAuthority = acmpca.CertificateAuthority.fromCertificateAuthorityArn(
        this,
        'CertificateAuthority',
        this.props.certificateManagerArn,
      )
    }
  }

  private getVpcAndSubnets() {
    const vpcAndSubnets = new VpcAndSubnets(this, 'VpcAndSubnets', {
      vpcId: this.props.vpcId,
      tier1Subnets: this.props.tier1SubnetDefinitions,
    })
    this.vpc = vpcAndSubnets.vpc
    this.tier1Subnets = vpcAndSubnets.tier1Subnets
  }

  private lookUpAccountHostedZone() {
    this.hostedZone = route53.PrivateHostedZone.fromLookup(this, 'HostedZone', {
      privateZone: true,
      vpcId: this.props.vpcId,
      domainName: this.props.hostedZoneDomainName,
    })
  }
}
