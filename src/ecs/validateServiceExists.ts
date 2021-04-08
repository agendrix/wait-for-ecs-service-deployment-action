
import * as core from "@actions/core";
import { exec } from "../../helpers/action/exec";

export default async function validateServiceExists(clusterName: string, serviceName: string) {
  core.info(`Validating that an ECS service with name ${serviceName} exists in ${clusterName} cluster...`);
  const service = JSON.parse(
    await exec(`
      aws ecs describe-services \
        --cluster ${clusterName} \
        --service ${serviceName} \
        --query "services[0].serviceName"
    `)
  );
  if (!service) {
    throw new Error(`No ECS service with name ${serviceName} was found in ${clusterName} cluster.`);
  }
}