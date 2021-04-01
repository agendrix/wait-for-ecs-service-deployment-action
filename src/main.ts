import * as core from "@actions/core";
import { promisify } from "util";
import { validateRequiredInputs } from "../helpers/action/validateRequiredInputs";
import { exec } from "../helpers/action/exec";

const sleep = promisify(setTimeout);

enum DeploymentStatus {
  PRIMARY = "PRIMARY",  // The most recent deployment of a service
  ACTIVE = "ACTIVE",    // A service deployment that still has running tasks, but are in the process of being replaced with a new PRIMARY deployment
  INACTIVE = "INACTIVE" // A deployment that has been completely replaced
}

enum RolloutState {
  IN_PROGRESS = "IN_PROGRESS", // New deployment is started
  COMPLETED = "COMPLETED",     // Service reaches a steady state
  FAILED = "FAILED",           // Service fails to reach a steady state and circuit breaker is enabled
}

interface Deployment {
  id: string;
  status: string;
  taskDefinitionArn: string;
  rolloutState: string;
}

interface Service {
  serviceName: string;
  deployments: Array<Deployment>;
}

async function fetchDeployments(clusterName: string, serviceName: string) {
  const services: Array<Service> = JSON.parse(await exec(`aws ecs describe-services --cluster ${clusterName} --service ${serviceName}`));
  const service: Service | undefined = services.find(s => s.serviceName === serviceName);
  if (service) {
    return service.deployments;
  } else {
    throw new Error(`No service ${serviceName} was found in ${clusterName} cluster.`);
  }
}

async function fetchPrimaryDeployment(clusterName: string, serviceName: string) {
  const deployments = await fetchDeployments(clusterName, serviceName);
  return deployments.find(d => d.status === DeploymentStatus.PRIMARY);
}

function validateDeploymentForTaskDefinitionExists(deployments: Array<Deployment>, taskDefinitionArn: string) {
  core.info(`Validating that a deployment exists for task definition ${taskDefinitionArn}...`);
  if (!deployments.find(d => d.taskDefinitionArn === taskDefinitionArn)) {
    throw new Error(`No deployment associated to task definition arn ${taskDefinitionArn} was found.`);
  }
}

function setDeploymentTimeout(deploymentTimeoutInMinutes: number) {
  return setTimeout(() => {
    throw new Error(`The rolling update did not complete before the timeout of ${deploymentTimeoutInMinutes} minutes.`);
  }, deploymentTimeoutInMinutes * 60 * 1000);
}

async function waitForDeploymentOutcome(clusterName: string, serviceName: string, taskDefinitionArn: string) {
  core.info("Waiting for deployment outcome...");

  let primaryDeployment = await fetchPrimaryDeployment(clusterName, serviceName);
  while (primaryDeployment?.taskDefinitionArn === taskDefinitionArn && primaryDeployment.rolloutState !== RolloutState.COMPLETED) {
   primaryDeployment = await fetchPrimaryDeployment(clusterName, serviceName);
   await sleep(5 * 1000);
 }

 return primaryDeployment?.taskDefinitionArn === taskDefinitionArn ? "success" : "skipped";
}

async function run(): Promise<void> {
  try {
    validateRequiredInputs(["cluster", "service", "task-definition-arn", "deployment-timeout-minutes"]);

    const clusterName: string = core.getInput("cluster");
    const serviceName: string = core.getInput("service");
    const taskDefinitionArn: string = core.getInput("task-definition-arn");
    const deploymentTimeoutInMinutes: number = Number(core.getInput("deployment-timeout-minutes"));
    const timeout = setDeploymentTimeout(deploymentTimeoutInMinutes);
    
    const deployments = await fetchDeployments(clusterName, serviceName);
    validateDeploymentForTaskDefinitionExists(deployments, taskDefinitionArn);

    const deploymentOutcome = waitForDeploymentOutcome(clusterName, serviceName, taskDefinitionArn);
    core.info(`Deployment outcome: ${deploymentOutcome}`);
    core.setOutput("deploymentOutcome", deploymentOutcome);
    clearTimeout(timeout);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
