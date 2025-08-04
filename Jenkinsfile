
// Jenkinsfile

pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code from the main branch...'
                git branch: 'main', url: 'https://github.com/ishahzaibhaider/Ideofuzion.git'
            }
        }

        stage('Build and Push Docker Image') {
            steps {
                script {
                    // Define your Docker Hub username and image name
                    def dockerhubUser = 'syedalishoaibhassan' // <-- VERY IMPORTANT: CHANGE THIS
                    def imageName = "${dockerhubUser}/ideofuzion-app:latest"

                    // Build the Docker image using the Dockerfile in your repo
                    sh "docker build -t ${imageName} ."

                    // Login to Docker Hub using credentials stored in Jenkins
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh "echo ${DOCKER_PASS} | docker login -u ${DOCKER_USER} --password-stdin"
                    }

                    // Push the newly built image to Docker Hub
                    sh "docker push ${imageName}"
                }
            }
        }

        stage('Deploy to Production') {
            steps {
                script {
                    // Define variables for the remote deployment
                    def remoteUser = 'ubuntu'
                    def remoteHost = '172.31.80.177'
                    def containerName = 'ideofuzion-app-container'
                    def appPort = 3000 // Port inside the container
                    def hostPort = 80  // Public port on the EC2 instance
                    def dockerhubUser = 'syedalishoaibhassan'
                    def imageName = "${dockerhubUser}/ideofuzion-app:latest"
        
                    // Securely load the MongoDB URI into an environment variable
                    withCredentials([string(credentialsId: 'mongodb-uri', variable: 'MONGODB_URI')]) {
                        // This command now uses double quotes for the remote command,
                        // which allows the MONGODB_URI variable to be expanded correctly.
                        sh """
                           ssh ${remoteUser}@${remoteHost} "docker pull ${imageName} && docker stop ${containerName} || true && docker rm ${containerName} || true && docker run -d --name ${containerName} -p ${hostPort}:${appPort} -e MONGODB_URI='${MONGODB_URI}' ${imageName}"
                        """
                    }
                }
            }
        }
    }
    post {
        always {
            sh "docker logout"
            cleanWs()
        }
    }
}
