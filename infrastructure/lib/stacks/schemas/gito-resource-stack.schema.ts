import { StackProps } from 'aws-cdk-lib'

import { subnetDefinition } from '../../environments.schema'

export interface GitoResourceStackProps extends StackProps {
  vpcId: string
  tier1SubnetDefinitions: subnetDefinition[]
  hostedZoneDomainName: string
  certificateManagerArn?: string
}
