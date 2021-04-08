
import { exec } from "../../helpers/action/exec";
import { Deployment, Service } from "../types";

export default async function fetchDeployments(clusterName: string, serviceName: string) {
  const deployments: Deployment[] | null = JSON.parse(
    await exec(`
      aws ecs describe-services \
        --cluster ${clusterName} \
        --service ${serviceName} \
        --query "services[0].deployments[*].{ id: id, status: status, taskDefinitionArn: taskDefinition, rolloutState: rolloutState }"
    `)
  );

  if (!deployments) throw new Error(`No service deployments were found. Please make sure that the aws-cli api has not changed.`);

  return deployments;
}