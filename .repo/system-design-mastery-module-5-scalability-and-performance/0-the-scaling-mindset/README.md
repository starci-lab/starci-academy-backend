# system-design-mastery-module-5-scalability-and-performance

Lesson support repo for **Module 5 — Scalability and performance**. Tracks use **k6** (Grafana image) plus **api-service** (NestJS, port **3000** in manifests), **Prometheus**, **KEDA**, **HPA**, or **VPA** depending on folder.

## Layout

| Folder | Purpose |
|--------|---------|
| **`.kubernetes/1-hpa/`** | **api-service** + **HPA** + **k6** (`k6-hpa-load-generator`) |
| **`.kubernetes/2-vpa/`** | **api-service** + **VPA** (`updateMode: Off`) + **k6** (`k6-vpa-load-generator`) |
| **`.kubernetes/3-keda/`** | **api-service** + **KEDA ScaledObject** + **k6** (`k6-keda-load-generator`) |

Apply **one** track at a time in the same namespace (each defines `api-service` and would conflict otherwise).

## Prerequisites

- Kubernetes cluster; **kubectl**; **Helm**.
- **Prometheus** + **KEDA** (for **3-keda** track only):

```bash
helm repo add kedacore https://kedacore.github.io/charts
helm repo update
helm install prometheus oci://registry-1.docker.io/bitnamicharts/prometheus --namespace default -f .helm/prometheus/values.yaml
helm install keda kedacore/keda --namespace keda --create-namespace -f .helm/keda/values.yaml
```

- **Metrics Server** for **HPA** CPU metrics (`kubectl top pods` not `<unknown>`): [metrics-server](https://github.com/kubernetes-sigs/metrics-server).
- **VPA** CRDs/controllers if you use **2-vpa**: [Vertical Pod Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/vertical-pod-autoscaler#installation).

## Apply (pick one track)

```bash
# Example: KEDA track
kubectl apply -f .kubernetes/3-keda/

# Example: HPA track
kubectl apply -f .kubernetes/1-hpa/

# Example: VPA track
kubectl apply -f .kubernetes/2-vpa/
```

## Verification

**Port-forward** (Service listens on **3000** in these manifests):

```bash
kubectl port-forward svc/api-service 18081:3000
```

**Start k6** (each track has its own Deployment name; replicas **0** until scaled):

| Track | Scale command |
|-------|----------------|
| KEDA | `kubectl scale deployment k6-keda-load-generator --replicas=1` |
| HPA | `kubectl scale deployment k6-hpa-load-generator --replicas=1` |
| VPA | `kubectl scale deployment k6-vpa-load-generator --replicas=1` |

**Watch** (examples):

```bash
kubectl get pods -w
# KEDA
kubectl get scaledobject api-service-so -w
kubectl get deploy api-service -w
# HPA
kubectl get hpa api-service-hpa -w
# VPA
kubectl describe vpa api-service-vpa
```

## Teardown

```bash
kubectl delete -f .kubernetes/3-keda/
# or 1-hpa / 2-vpa
helm uninstall prometheus -n default
helm uninstall keda -n keda
```
