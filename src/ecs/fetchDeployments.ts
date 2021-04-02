
import { exec } from "../../helpers/action/exec";
import { Service } from "../types";

export async function fetchDeployments(clusterName: string, serviceName: string) {
  const result = JSON.parse(await exec(`aws ecs describe-services --cluster ${clusterName} --service ${serviceName}`));
  const services: Array<Service> = result.services;
  const service = services.find(s => s.serviceName === serviceName);
  const deployments = service?.deployments;
  if (!deployments) throw new Error(`No service deployments were found. Please make sure that the aws-cli api has not changed.`);

  return deployments;
}