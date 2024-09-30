/* eslint-disable semi */
/* eslint-disable object-curly-spacing */
import {Environments} from './environments.schema';

const commonEnvironmentAttributes = {
  projectName: 'onepager',
  certificateManagerArn:
    'arn:aws:acm-pca:eu-central-1:760112866941:certificate-authority/77a51913-2b11-4118-92eb-90c626f772c1',
  corp: {
    cidrRanges: ['10.108.5.0/25', '10.108.5.128/25'],
    // 10.108.5.128/25 (1b) 10.108.5.0/25 (1a)
  },
};

const commonPocEnvironmentAttributes = {
  vpcId: 'vpc-06320eb78b05cc514',
  hostedZoneDomainName: '5714mdev-poc.corp.aws.novonordisk.com',
  tier1SubnetDefinitions: [
    {
      id: 'subnet-06ea6349bbe3b8706',
      az: 'eu-central-1a',
    },
    {
      id: 'subnet-097f0d182d6ead316',
      az: 'eu-central-1b',
    },
  ],
  awsEnv: {
    account: '581512767554',
    region: 'eu-central-1',
  },
  cache: {
    nodeInstanceType: 'cache.t4g.micro',
  },
  dhlAccountId: '703762392898',
};

export const environments: Environments = {
  /** To create an additional environment configuration, create another key in the main object.*/
  poc: {
    ...commonEnvironmentAttributes,
    ...commonPocEnvironmentAttributes,
    deploymentName: 'poc',
  },
};
