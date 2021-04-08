
import * as core from "@actions/core";
import { exec } from "../../helpers/action/exec";
import { Service } from "../types";

export default async function isServiceStable(clusterName: string, serviceName: string) {
  core.info(`Validating that an ECS cluster with name ${clusterName} exists...`);
  const result = JSON.parse(
    await exec(`
      aws ecs describe-services \
        --cluster ${clusterName} \
        --service ${serviceName} \
        --query "services[*].[{ desiredCount: desiredCount, runningCount: runningCount, deployments: deployments[*].id }]"
    `)
  );
  const service: Service = result.services.shift();

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
