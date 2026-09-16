# Multi-Stage Dockerfile for .NET 9 ASP.NET Core Deployment on Render
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["Piu.csproj", "./"]
RUN dotnet restore "Piu.csproj"

# Copy full source and publish
COPY . .
RUN dotnet publish "Piu.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Render sets PORT environment variable dynamically
ENV PORT=10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "Piu.dll"]
