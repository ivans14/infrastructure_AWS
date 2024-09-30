import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as acmpca from 'aws-cdk-lib/aws-acmpca'
import * as r53 from 'aws-cdk-lib/aws-route53'

export interface AppHostingStackProps extends cdk.StackProps {
  vpc: ec2.IVpc
  tier1Subnets: ec2.ISubnet[]
  certificateAuthority: acmpca.ICertificateAuthority
  hostedZone: r53.IHostedZone
  isPersonalDeployment: boolean
  deploymentName: string
}
