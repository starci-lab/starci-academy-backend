# Complex Applications and Helm Charts

This lesson demonstrates how to deploy production-ready database clusters using **Helm** with **OCI Charts** and **Bitnami Legacy** images.

## 1. Prerequisites
- Kubernetes cluster (Minikube, EKS, GKE, etc.)
- Helm 3+ installed

## 2. Deployment

We use `values.yaml` files to override the default images to use `bitnamilegacy/*` for maximum stability.

### MongoDB Sharded (11 Pods)
```bash
cd mongodb-sharded
helm upgrade --install mongodb-sharded oci://registry-1.docker.io/bitnamicharts/mongodb-sharded \
  -n database --create-namespace -f values.yaml --wait
```

### PostgreSQL HA (5 Pods)
```bash
cd ../postgresql-ha
helm upgrade --install postgresql-ha oci://registry-1.docker.io/bitnamicharts/postgresql-ha \
  -n database -f values.yaml --wait
```

### Redis Cluster (6 Pods)
```bash
cd ../redis-cluster
helm upgrade --install redis-cluster oci://registry-1.docker.io/bitnamicharts/redis-cluster \
  -n database -f values.yaml --wait
```

## 3. Verification
```bash
kubectl get pods -n database -w
```

## 4. Cleanup
```bash
helm uninstall mongodb-sharded -n database
helm uninstall postgresql-ha -n database
helm uninstall redis-cluster -n database
```
