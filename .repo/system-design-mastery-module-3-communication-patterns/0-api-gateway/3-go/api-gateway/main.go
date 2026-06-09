package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

func main() {
	userURL, _ := url.Parse("http://user-service:3001")
	productURL, _ := url.Parse("http://product-service:3002")
	orderURL, _ := url.Parse("http://order-service:3003")

	userProxy := httputil.NewSingleHostReverseProxy(userURL)
	productProxy := httputil.NewSingleHostReverseProxy(productURL)
	orderProxy := httputil.NewSingleHostReverseProxy(orderURL)

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if strings.HasPrefix(path, "/users") {
			userProxy.ServeHTTP(w, r)
		} else if strings.HasPrefix(path, "/products") {
			productProxy.ServeHTTP(w, r)
		} else if strings.HasPrefix(path, "/orders") {
			orderProxy.ServeHTTP(w, r)
		} else {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			_ = json.NewEncoder(w).Encode(map[string]string{
				"message": fmt.Sprintf("No route for %s", path),
			})
		}
	})

	log.Println("API Gateway listening on :8000")
	if err := http.ListenAndServe(":8000", nil); err != nil {
		log.Fatalf("Gateway failed: %v", err)
	}
}
