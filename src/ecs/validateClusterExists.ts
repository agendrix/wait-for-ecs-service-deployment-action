import * as core from "@actions/core";
import { exec } from "../../helpers/action/exec";

export default async function validateClusterExists(clusterName: string): Promise<void> {
  core.info(`Validating that an ECS cluster with name ${clusterName} exists...`);
  const cluster = JSON.parse(
    await exec(`
      aws ecs describe-clusters \
        --clusters ${clusterName} \
        --query "clusters[0].clusterName"
    `)
  );
  if (!cluster) {
    throw new Error(`No ECS clusters with name ${clusterName} was found.`);
  }
}
