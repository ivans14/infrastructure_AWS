import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { VpcAndSubnetsProps } from './vpc-subnets.schema'
import { Construct } from 'constructs'

export class VpcAndSubnets extends Construct {
  vpc: ec2.IVpc
  tier1Subnets: ec2.ISubnet[]
  constructor(
    scope: Construct,
    id: string,
    vpcAndSubnetProps: VpcAndSubnetsProps,
  ) {
    super(scope, id)

    this.vpc = ec2.Vpc.fromLookup(this, 'VPC', {
      vpcId: vpcAndSubnetProps.vpcId,
    })

    this.tier1Subnets = vpcAndSubnetProps.tier1Subnets.map((ele) => {
      return ec2.Subnet.fromSubnetAttributes(this, ele.id, {
        subnetId: ele.id,
        availabilityZone: ele.az,
      })
    })
  }
}
