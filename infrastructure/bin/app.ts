#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { environments } from '../lib/environments'
import { GitoResourceStack } from '../lib/stacks/gito-resource-stack'
import { AppHostingStack } from '../lib/stacks/app-hosting'

const app = new cdk.App()

const envName = 'poc'
const environment = environments[envName] ?? environments.dev
const deploymentName = environment.deploymentName
const isPersonalDeployment = !['dev', 'tst', 'prd'].includes(deploymentName)
const stackPrefix = `app-${(!isPersonalDeployment ? envName : `${deploymentName}`).toLowerCase()}` 

const shouldTerminationProtectionBeEnabled = !isPersonalDeployment

const gitoResourceStack = new GitoResourceStack(
  app,
  `${stackPrefix}-GitoResourceStack`,
  {
    terminationProtection: shouldTerminationProtectionBeEnabled,
    env: environment.awsEnv,
    vpcId: environment.vpcId,
    tier1SubnetDefinitions: environment.tier1SubnetDefinitions,
    hostedZoneDomainName: environment.hostedZoneDomainName,
    certificateManagerArn: environment.certificateManagerArn,
  },
)

new AppHostingStack(
  app,
  `${stackPrefix}-AppHostingStack`,
  {
    terminationProtection: shouldTerminationProtectionBeEnabled,
    isPersonalDeployment,
    deploymentName,
    vpc: gitoResourceStack.vpc,
    tier1Subnets: gitoResourceStack.tier1Subnets,
    certificateAuthority: gitoResourceStack.certificateAuthority!,
    env: environment.awsEnv,
    hostedZone: gitoResourceStack.hostedZone,
  },
)
