import * as core from "@actions/core";
import { validateRequiredInputs } from "../helpers/action/validateRequiredInputs";
import { validateClusterExists } from "./ecs/validateClusterExists";
import { validateDeploymentForTaskDefinitionExists } from "./ecs/validateDeploymentForTaskDefinitionExists";
import { validateServiceExists } from "./ecs/validateServiceExists";
import { waitForDeploymentOutcome } from "./ecs/waitForDeploymentOutcome";

function setDeploymentTimeout(deploymentTimeoutInMinutes: number) {
  return setTimeout(() => {
    throw new Error(`The rolling update did not complete before the timeout of ${deploymentTimeoutInMinutes} minutes.`);
  }, deploymentTimeoutInMinutes * 60 * 1000);
}

async function run(): Promise<void> {
  try {
    validateRequiredInputs(["cluster", "service", "task-definition-arn", "deployment-timeout-minutes"]);

    const clusterName: string = core.getInput("cluster");
    const serviceName: string = core.getInput("service");
    const taskDefinitionArn: string = core.getInput("task-definition-arn");
    const deploymentTimeoutInMinutes: number = Number(core.getInput("deployment-timeout-minutes"));
    const timeout = setDeploymentTimeout(deploymentTimeoutInMinutes);

    await validateClusterExists(clusterName);
    await validateServiceExists(clusterName, serviceName);
    await validateDeploymentForTaskDefinitionExists(clusterName, serviceName, taskDefinitionArn);

    const deploymentOutcome = waitForDeploymentOutcome(clusterName, serviceName, taskDefinitionArn, timeout);
    core.info(`Deployment outcome: ${deploymentOutcome}`);
    core.setOutput("deployment-outcome", deploymentOutcome);
    clearTimeout(timeout);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
