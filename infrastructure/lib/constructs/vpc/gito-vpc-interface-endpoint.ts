import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'

export class GitoVpcEndpoint extends ec2.InterfaceVpcEndpoint {
  constructor(
    scope: Construct,
    id: string,
    props: ec2.InterfaceVpcEndpointProps,
  ) {
    super(scope, id, props)

    // SR.AWS.EC2.VPC.002 - Ensure Amazon VPC endpoints do not allow unknown cross account access
    // SR.AWS.EC2.VPC.004 - VPC Endpoint Exposed to any IAM users
    super.addToPolicy(new iam.PolicyStatement({
      actions: ['*'],
      resources: ['*'],
      principals: [new iam.AnyPrincipal()],
      conditions: {
        StringEquals: {
          'aws:PrincipalAccount': cdk.Stack.of(this).account,
        },
      },
    }))
  }
}
