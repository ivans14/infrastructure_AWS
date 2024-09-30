import * as fs from 'fs'
import crypto from 'crypto'
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'
export interface TagsInUseDefinition {
  dhlLineTag: string
  tags: string[]
}

export const getEnvVar = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Environment variable "${name}" is not defined`)
  }
  return value
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function processConfigToTagsInUseDefinition(config: any[]): TagsInUseDefinition[] {
  return config.map(lineConfig => {
    const dhlLineTag = lineConfig.LineId
    let tags: string[] = []
    if (lineConfig.EnabledFeatures) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tags = lineConfig.EnabledFeatures?.map((feature: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return feature.Signals?.map((signal: any) => signal?.Tag)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }).filter((item: any) => item).flat()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tags = tags.filter((tag: any) => tag) // Remove undefined (and other falsy values)
      tags = [...new Set(tags)] // Remove duplicates
    }

    return { dhlLineTag, tags }
  })
}

/**
 * Reads a config file and returns it as a string
 * @arg dhlLineTag: the tag of the DHL line
 */
export function readConfigFile(dhlLineTag: string): string {
  const configFilePath = `../OEE/ConfigReader/Configuration/${dhlLineTag}.json`
  const configFile = fs.readFileSync(configFilePath, 'utf8')
  return configFile
}

/**
 * Returns an array of all files in a dir as strings
 * @arg folderPath: path to the directory
 */
export function readFilesInFolder(folderPath: string): Array<string> {
  const filesInFolder: Array<string> = fs
    .readdirSync(folderPath, { withFileTypes: true })
    .filter((el) => el.isFile())
    .map((el) => el.name)

  return filesInFolder
}

export function stripFileExtension(fileName: string): string {
  /*
   * Strips the file extension from a file name
   *
   * @arg fileName: name of the file
   */
  const fileNameWithoutExtension = fileName.split('.')[0]
  return fileNameWithoutExtension
}

export const createMD5Hash = (input: string) => {
  return crypto.createHash('md5').update(input).digest('hex')
}

export const getSecretsManagerSecret = async (secretName: string) => {
  const client = new SecretsManagerClient({
    region: 'eu-central-1',
  })
  try {
    const data = await client.send(new GetSecretValueCommand({ SecretId: secretName }))

    if (data.SecretString) {
      return JSON.parse(data.SecretString)
    } else {
      throw new Error('Secret not found')
    }
  } catch (error) {
    console.error('Unable to retrieve secret from AWS Secrets Manager')
    throw new Error(JSON.stringify(error))
  }
}

