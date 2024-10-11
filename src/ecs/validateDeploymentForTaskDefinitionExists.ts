import * as core from "@actions/core";
import fetchDeployments from "./fetchDeployments";

export default async function validateDeploymentForTaskDefinitionExists(clusterName: string, serviceName: string, taskDefinitionArn: string): Promise<void> {
  core.info(`Validating that a deployment exists for task definition ${taskDefinitionArn}...`);
  const deployments = await fetchDeployments(clusterName, serviceName);
  if (!deployments.find(d => d.taskDefinitionArn === taskDefinitionArn)) {
    throw new Error(`No deployment associated to task definition arn ${taskDefinitionArn} was found.`);
  }
}
