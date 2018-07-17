# Distributed Debugging for Kubernetes and Serverless Applications using AWS X-Ray

This repo explains how AWS X-Ray can be used for distributed debugging in Kubernetes and Serverless applications.

## Application

The application consists of three microservices: `webapp`, `greeting`, and `name`. The `webapp` microservice calls `greeting` and `name` microservice to create a message and return the response.

- Each microservice is in a different repo:

	Service | Link
	------- | ----
	`greeting` | https://github.com/arun-gupta/microservices-greeting
	`name` | https://github.com/arun-gupta/microservices-name
	`webapp` | https://github.com/arun-gupta/microservices-webapp

- Clone all the repos
- Create Docker image for each repo. By default, the images are generated with `arungupta` repo and `latest` tag. Helm charts used for deploying the application use `xray` tag. These images can be created using the following command:

	```
	mvn package -Pdocker -Ddocker.tag=xray
	```

	The images can be created in a different repo as:

	```
	mvn package -Pdocker -Ddocker.repo=<repo>
	```

- Push Docker image to the registry:

	```
	mvn install -Pdocker
	```

## Create Kubernetes Cluster

[kops](https://github.com/kubernetes/kops) is a commmunity-supported way to get a Kubernetes cluster up and running on AWS.

- Set AZs:

	```
	export AWS_AVAILABILITY_ZONES="$(aws ec2 describe-availability-zones \
		--query 'AvailabilityZones[].ZoneName' \
		--output text | \
		awk -v OFS="," '$1=$1')"
	```

- Set state store: `export KOPS_STATE_STORE=s3://kubernetes-aws-io`
- Create cluster:

	```
	kops create cluster \
		--zones ${AWS_AVAILABILITY_ZONES} \
		--master-count 1 \
		--master-size m4.xlarge \
		--node-count 3 \
		--node-size m4.2xlarge \
		--name xray.k8s.local \
		--yes
	```

## Setup X-Ray in Kubernetes

- `arungupta/xray:us-west-2` Docker image is already available on Docker Hub. Optionally, you may build the image:

	```
	cd config/xray
	docker build -t arungupta/xray:latest .
	docker image push arungupta/xray:us-west-2
	```

- Deploy the DaemonSet: `kubectl apply -f xray-daemonset.yaml`

## Deploy the Application

- Deploy the application:

	```
	helm install --name myapp myapp
	```

	The application is configured to use `arungupta/<service>:xray`. Make sure to update the value in `myapp/values.yaml` to match your repo and tag.

- Access the application:

	```
	curl http://$(kubectl get svc/myapp-webapp -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
	```

- Open [X-Ray console](https://us-west-2.console.aws.amazon.com/xray/home?region=us-west-2#/service-map) and watch the service map and traces.


## License Summary

This sample code is made available under a modified MIT license. See the LICENSE file.
