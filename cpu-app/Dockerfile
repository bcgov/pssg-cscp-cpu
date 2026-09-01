
##################################################################################################
#                                                                                                 #
#   CPU-SPA: ASP.NET Core + Angular Single Page Application (SPA)                                 #
#                                                                                                 #
#   LOCAL BUILD & RUN INSTRUCTIONS                                                                #
#   --------------------------------------------------------------------------------------------  #
#   1. Build the Docker image:                                                                    #
#        docker build \                                                                           #
#          -t cpu-spa:local \                                                                     #
#          -f cpu-app/Dockerfile \                                                                #
#          --build-arg BUILD_IMAGE_NAME=cpu-spa \                                                 #
#          --build-arg BUILD_VERSION=local-dev \                                                  #
#          .                                                                                      #
#                                                                                                 #
#   2. Run the container:                                                                         #
#        docker run --rm -it -p 8080:8080 cpu-spa:local                                           #
#                                                                                                 #
#   3. Inspect the running container (in another terminal):                                       #
#        docker exec -it <container_id_or_name> bash                                              #
#        whoami            # should print 'appuser'                                               #
#        touch /app/testfile  # should succeed                                                    #
#        printenv BUILD_IMAGE_NAME                                                                #
#        printenv BUILD_VERSION                                                                   #
#                                                                                                 #
#   ARCHITECTURE & BUILD OVERVIEW                                                                 #
#   --------------------------------------------------------------------------------------------  #
#   - Multi-stage build: Angular frontend (cpu-app/ClientApp) & .NET backend (cpu-app)            #
#   - Angular is built in its own stage, output is copied to .NET app's wwwroot                   #
#   - .NET app serves the Angular SPA as static files                                             #
#   - Runtime container runs as non-root user (appuser) for security                              #
#   - All files in /app are owned by appuser:appgroup                                             #
#   - Build metadata (BUILD_IMAGE_NAME, BUILD_VERSION) available as env vars                      #
#                                                                                                 #
#   TECHNOLOGIES                                                                                  #
#   --------------------------------------------------------------------------------------------  #
#   - Backend: ASP.NET Core (.NET 10)                                                             #
#   - Frontend: Angular (in cpu-app/ClientApp)                                                    #
#   - Build: Docker builds both, .NET app serves Angular SPA                                     #
#                                                                                                 #
##################################################################################################


# ======================
# Angular  Build Stage
# ======================
FROM node:22.23.2-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS angular-build 
# as per package.json

ARG BUILD_IMAGE_NAME
ARG BUILD_VERSION

WORKDIR /app

# Copying source files
COPY ./cpu-app/ClientApp/ ./cpu-app/ClientApp/
WORKDIR /app/cpu-app/ClientApp

# Installing dependencies with npm ci for faster, deterministic builds instead of  RUN npm install
RUN npm ci

# Adding Node.js memory optimization for large Angular builds
ENV NODE_OPTIONS="--max-old-space-size=8192"

# Build Angular app
RUN npm run build
# removed --configuration=production from npm run build, as it is already defined in angular.json which executes
# ng build --configuration=production

# ======================
# .NET Build Stage
# ======================
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS dotnet-build

ARG BUILD_IMAGE_NAME
ARG BUILD_VERSION

WORKDIR /src

COPY . .
# Restore .NET dependencies
RUN dotnet restore cpu-app/cpu-app.csproj

# Copy angular dist into the dotnet app.
COPY --from=angular-build /app/cpu-app/ClientApp/dist/browser/ ./cpu-app/wwwroot/

RUN dotnet publish cpu-app/cpu-app.csproj -c Release -o /app/publish --no-restore --verbosity minimal

# ======================
# Runtime Image
# ======================
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime

ARG BUILD_IMAGE_NAME
ARG BUILD_VERSION

# Update all system packages for latest security patches FIRST.
# This ensures OS-level vulnerabilities are fixed.
RUN apk update && \
    apk upgrade && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Debug/Fail Fast: See if args are really set!
RUN echo "BUILD_IMAGE_NAME='$BUILD_IMAGE_NAME'" && if [ -z "$BUILD_IMAGE_NAME" ]; then echo "BUILD_IMAGE_NAME is empty!"; exit 1; fi
RUN echo "BUILD_VERSION='$BUILD_VERSION'" && if [ -z "$BUILD_VERSION" ]; then echo "BUILD_VERSION is empty!"; exit 1; fi

# 1. Create non-root user and group
RUN addgroup -S appgroup && adduser -S -G appgroup appuser

# 2. Copy published app from build stage as root
COPY --from=dotnet-build /app/publish ./

# 3. Set ownership of all app files to appuser:appgroup (key for security!)
RUN chown -R appuser:appgroup /app

# 4. Accept build-time arguments and set environment variables
ENV BUILD_IMAGE_NAME=${BUILD_IMAGE_NAME}
ENV BUILD_VERSION=${BUILD_VERSION}

# 5. Switch to non-root user for runtime
USER appuser

EXPOSE 8080

ENV ASPNETCORE_URLS=http://*:8080

ENTRYPOINT ["dotnet", "cpu-app.dll"]