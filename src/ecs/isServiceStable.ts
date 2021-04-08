
import * as core from "@actions/core";
import { exec } from "../../helpers/action/exec";
import { Service } from "../types";

export default async function isServiceStable(clusterName: string, serviceName: string) {
  core.info(`Validating that an ECS cluster with name ${clusterName} exists...`);
  const service: Service | null = JSON.parse(
    await exec(`
      aws ecs describe-services \
        --cluster ${clusterName} \
        --service ${serviceName} \
        --query "services[0].{ desiredCount: desiredCount, runningCount: runningCount, deployments: deployments[*].id }"
    `)
  );

  if (!service) throw new Error(`No service ${serviceName} was found in cluster ${clusterName}`);

  core.info(`
    Service desired count: ${service.desiredCount} 
    Service running count: ${service.runningCount}
    Service ongoing deployments count: ${service.deployments.length}
  `);

  return (
    service.desiredCount === service.runningCount &&
    service.deployments.length === 1
  );
}
