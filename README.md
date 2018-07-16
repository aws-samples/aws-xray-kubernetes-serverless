## AWS Xray Kubernetes Serverless

Show distributed debugging in Kubernetes and Serverless applications using AWS X-Ray

## Create Kubernetes Cluster

https://github.com/kubernetes/kops[kops] is a commmunity-supported way to get a Kubernetes cluster up and running on AWS.

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

- Access the application:

	```
	curl http://$(kubectl get svc/myapp-webapp -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
	```

- Open the [X-Ray console](https://us-west-2.console.aws.amazon.com/xray/home?region=us-west-2#/service-map) and watch the service map and traces.


## License Summary

This sample code is made available under a modified MIT license. See the LICENSE file.
