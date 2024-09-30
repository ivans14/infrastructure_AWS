import { 
  CloudFormationCustomResourceEvent,
  CdkCustomResourceResponse,
  Context,
} from 'aws-lambda'

import * as AWS from 'aws-sdk'
import { getEnvVar } from '../../../util'

const ec2 = new AWS.EC2({ apiVersion: '2016-11-15' })
const id = getEnvVar('vpcEndpointId')

export const handler = async (event: CloudFormationCustomResourceEvent, context: Context) => {

  const response: CdkCustomResourceResponse = {
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    PhysicalResourceId: context.logGroupName,
  }
  
  switch (event.RequestType) {
    case 'Update': {
      const ips = await getVpcEdnpointIps(id)
      response.Status = 'SUCCESS'
      response.Data = {
        numberOfIps: ips.length,
        ...ips.reduce((a, v, i) => ({ ...a, [`vpcEndPointIp${i}`]: v }), {}),
      }
      return response
    }
    case 'Create': {
      const ips = await getVpcEdnpointIps(id)
      response.Status = 'SUCCESS'
      response.Data = {
        numberOfIps: ips.length,
        ...ips.reduce((a, v, i) => ({ ...a, [`vpcEndPointIp${i}`]: v }), {}),
      }
      return response
    }
    case 'Delete': {
      return
    }
    default: {
      throw new Error('Unknown request type')
    }
  }
}

const getVpcEdnpointIps = async (id: string): Promise<string[]> => {
  console.log(`Calling describeVpcEndpoints for id=${id}`)
  const vpce = await ec2.describeVpcEndpoints({
    VpcEndpointIds: [id],
  }).promise()
  if (!vpce.VpcEndpoints) {
    throw Error (`No VPC Endpoint found for id=${id}`)
  }

  const eniIds = vpce.VpcEndpoints?.map( ele => {
    return ele.NetworkInterfaceIds
  }).flat()
    // This removes undefined elements and ensure typescript also updates the type to not include undefined.
    .filter((item): item is string => !!item)
  console.log(`Calling describeNetworkInterfaces for id=${eniIds.join(',')}`)
  const enis = await ec2.describeNetworkInterfaces({
    NetworkInterfaceIds: eniIds,
  }).promise()
  if (!enis.NetworkInterfaces) {
    throw Error (`No Elastic Network Interface found for id=${eniIds.join(',')}`)
  }
  console.log(`Found ${enis.NetworkInterfaces.length} Elastic Network Interfaces`)
  const ips = enis.NetworkInterfaces?.map( eni => 
    eni.PrivateIpAddress,
  ).filter((item): item is string => !!item)
  
  return ips
}
