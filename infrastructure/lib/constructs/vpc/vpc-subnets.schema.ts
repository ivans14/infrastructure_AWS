import { subnetDefinition } from '../../environments.schema'

export interface VpcAndSubnetsProps {
  readonly vpcId: string;
  readonly tier1Subnets: subnetDefinition[];
}
