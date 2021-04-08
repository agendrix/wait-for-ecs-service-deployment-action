
import * as core from "@actions/core";
import fetchDeployments from "./fetchDeployments";
import parseTaskDefinitionArn from "./parseTaskDefinition";

export default async function validateDeploymentForTaskDefinitionExists(clusterName: string, serviceName: string, taskDefinitionArn: string) {
  core.info(`Validating that a deployment exists for task definition ${taskDefinitionArn}...`);
  const deployments = await fetchDeployments(clusterName, serviceName);
  if (!deployments.find(d => parseTaskDefinitionArn(d.taskDefinitionArn) === parseTaskDefinitionArn(taskDefinitionArn))) {
    throw new Error(`No deployment associated to task definition arn ${taskDefinitionArn} was found.`);
  }
}