export type subnetDefinition = {
  /** Id of the subnet */
  id: string
  /** Id of the availability zone subnet is in e.g eu-central-1a */
  az: string
};

interface AwsEnv {
  /** The account id to deploy ressources to */
  account: string
  /** The region to deploy ressources to */
  region: string
}

export interface Environment {
  projectName: string
  certificateManagerArn: string
  deploymentName: string
  corp: {
    cidrRanges: string[],
  },
  vpcId: string
  hostedZoneDomainName: string
  tier1SubnetDefinitions: subnetDefinition[]
  awsEnv: AwsEnv
}

export interface Environments {
  [name: string]: Environment
}
