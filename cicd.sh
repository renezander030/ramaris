#!/bin/bash

<notes
      this is to build and run containers. push included.
      
      usage
      cicd.sh 
notes

# build on plaintexthell
export DOCKER_HOST=192.168.0.9

docker build -t dolankirza/public:ramaris-blockchain-0.1.25 .
docker push dolankirza/public:ramaris-blockchain-0.1.26

>>comment
set -ex

PARENT_DIR=$(basename "${PWD%/*}")
CURRENT_DIR="${PWD##*/}"
IMAGE_NAME="$PARENT_DIR/$CURRENT_DIR"
TAG="${1}"


REGISTRY="hub.docker.com"

docker build -t ${REGISTRY}/${IMAGE_NAME}:${TAG} .
docker tag ${REGISTRY}/${IMAGE_NAME}:${TAG} ${REGISTRY}/${IMAGE_NAME}:latest
docker push ${REGISTRY}/${IMAGE_NAME}
docker tag ${REGISTRY}/${IMAGE_NAME}:latest ${REGISTRY}/${IMAGE_NAME}:${TAG}
docker push ${REGISTRY}/${IMAGE_NAME}

Param(
    [switch]$Build,
    [switch]$Run,
    [switch]$Push,
    [string]$DockerHubUserName = "dolankirza",
    [string]$DockerHubRepo = "public",
    [string]$ProductName = "ramaris",
    [ValidateSet("ui", "blockchain", "database")]
    [Parameter(Mandatory = $true)]
    [string]$Container,
    [Parameter(Mandatory = $true)]
    [string]$Version
)


If ($Build) {
    If ($Container -eq "ui") {
        docker build -t "$($DockerHubUserName)/$($DockerHubRepo):$($ProductName)-ui-$Version" .
        # docker-compose --file docker-compose.yml up -d
    }
    If ($Container -eq "blockchain") {
        # switch to sub folder so context in Dockerfile still is correct
        Set-Location .\src\blockchain
        docker build -t "$($DockerHubUserName)/$($DockerHubRepo):$($ProductName)-blockchain-$Version" .
        # switch back
        Set-Location $PSScriptRoot
        # docker-compose --file docker-compose.yml up -d
    }
}
ElseIf ($Run) {
        docker run -it -d -p3000:3000 --name "$($ProductName)-$($Container)" "$($DockerHubUserName)/$($DockerHubRepo):$($ProductName)-ui-$Version"
}
ElseIf ($Push) {
    docker push "$($DockerHubUserName)/$($DockerHubRepo):$($ProductName)-$($Container)-$Version"
}
comment