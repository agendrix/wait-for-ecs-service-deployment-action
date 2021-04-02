
import { fetchDeployments } from "./fetchDeployments";
import { DeploymentStatus } from "../types";

export async function fetchPrimaryDeployment(clusterName: string, serviceName: string) {
  const deployments = await fetchDeployments(clusterName, serviceName);
  const primaryDeployment = deployments.find(d => d.status === DeploymentStatus.PRIMARY);
  if (!primaryDeployment) {
    throw new Error(`No PRIMARY deployment was found. Please make sure that the aws-cli api has not changed.`);
  }

  return primaryDeployment;
}