
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
#   - Backend: ASP.NET Core (.NET 8)                                                              #
#   - Frontend: Angular (in cpu-app/ClientApp)                                                    #
#   - Build: Docker builds both, .NET app serves Angular SPA                                      #
#                                                                                                 #
##################################################################################################


# ======================
# Angular  Build Stage
# ======================
FROM node:22-alpine AS angular-build 
# upgraded from 20

ARG BUILD_IMAGE_NAME
ARG BUILD_VERSION

WORKDIR /app

COPY ./cpu-app/ClientApp/ ./cpu-app/ClientApp/

WORKDIR /app/cpu-app/ClientApp

RUN npm install
RUN npm run build -- --configuration production

# ======================
# .NET Build Stage
# ======================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS dotnet-build

ARG BUILD_IMAGE_NAME
ARG BUILD_VERSION

WORKDIR /src

COPY . .

# Copy angular dist into the dotnet app
COPY --from=angular-build /app/cpu-app/ClientApp/dist/ ./cpu-app/wwwroot/

RUN dotnet publish cpu-app/cpu-app.csproj -c Release -o /app/publish

# ======================
# Runtime Image
# ======================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

ARG BUILD_IMAGE_NAME
ARG BUILD_VERSION

# Update all system packages for latest security patches FIRST.
# This ensures OS-level vulnerabilities are fixed.
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Debug/Fail Fast: See if args are really set!
RUN echo "BUILD_IMAGE_NAME='$BUILD_IMAGE_NAME'" && if [ -z "$BUILD_IMAGE_NAME" ]; then echo "BUILD_IMAGE_NAME is empty!"; exit 1; fi
RUN echo "BUILD_VERSION='$BUILD_VERSION'" && if [ -z "$BUILD_VERSION" ]; then echo "BUILD_VERSION is empty!"; exit 1; fi

# 1. Create non-root user and group
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

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