.PHONY: all build-ui build-go run clean

all: build-ui build-go

build-ui:
	cd ui && npm install && npm run build

build-go:
	go build -o arch-intel main.go

run: build-go
	./arch-intel

clean:
	rm -f arch-intel
	rm -rf ui/build
