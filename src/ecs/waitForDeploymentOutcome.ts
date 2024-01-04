import * as core from "@actions/core";
import { promisify } from "util";
import { RolloutState, DeploymentOutcome } from "./types";
import isServiceStable from "./isServiceStable";
import fetchPrimaryDeployment from "./fetchPrimaryDeployment";

const sleep = promisify(setTimeout);
const STATUS_CHECK_FREQUENCY_MS: number = 5000;

export default async function waitForDeploymentOutcome(clusterName: string, serviceName: string, taskDefinitionArn: string, deploymentTimeout: NodeJS.Timeout, statusCheckFrequencyInMs: number = STATUS_CHECK_FREQUENCY_MS) {
  core.info("Waiting for deployment outcome...");
  let primaryDeployment = await fetchPrimaryDeployment(clusterName, serviceName);
  while (primaryDeployment.taskDefinitionArn === taskDefinitionArn && primaryDeployment.rolloutState !== RolloutState.COMPLETED) {
    const currentPrimaryDeployment = await fetchPrimaryDeployment(clusterName, serviceName);
    if (currentPrimaryDeployment.taskDefinitionArn === primaryDeployment.taskDefinitionArn && currentPrimaryDeployment.id !== primaryDeployment.id) {
      core.info("A rolling update for the same task definition was triggered (force-new-deployment), timeout will be restarted...");
      deploymentTimeout.refresh();
    }

    primaryDeployment = currentPrimaryDeployment;
    await sleep(statusCheckFrequencyInMs);
  }

  const previousTaskDefinitionRevision = taskDefinitionArn.split(":").pop()!;
  const newTaskDefinitionRevision = primaryDeployment.taskDefinitionArn.split(":").pop()!;

  if (primaryDeployment.taskDefinitionArn !== taskDefinitionArn && newTaskDefinitionRevision > previousTaskDefinitionRevision) {
    core.info(`A new PRIMARY deployment is registered with task definition ${primaryDeployment.taskDefinitionArn}.`);
    return DeploymentOutcome.SKIPPED;
  } else if (primaryDeployment.taskDefinitionArn !== taskDefinitionArn && newTaskDefinitionRevision < previousTaskDefinitionRevision) {
    core.error(`A rollback has been triggered. Starting a new deployment with task definition ${primaryDeployment.taskDefinitionArn}.`);
    return DeploymentOutcome.ROLLBACK;
  }
  else if (isServiceStable(clusterName, serviceName)) {
    core.info(`The deployment associated with ${taskDefinitionArn} has completed successfully and the service ${serviceName} is stable`);
    return DeploymentOutcome.SUCCESS;
  } else {
    core.error(`The primary deployment has a rollout status of ${primaryDeployment.rolloutState} but the the service does not seem stable. The action will therefore continue waiting until the service becomes stable.`);
    // Validate deployment timeout existence to prevent infinite loop
    if(deploymentTimeout[Symbol.toPrimitive]()) waitForDeploymentOutcome(clusterName, serviceName, taskDefinitionArn, deploymentTimeout);
  }
}
