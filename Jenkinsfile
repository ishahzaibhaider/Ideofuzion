// Jenkinsfile

/**
 * This pipeline automates the deployment of the Ideofuzion application.
 * It correctly builds both the server and the client-side UI.
 */
pipeline {
    // 1. Agent and Tools Configuration
    agent any
    tools {
        nodejs 'NodeJS-24' // Make sure this matches your Jenkins tool name
    }

    // 2. Pipeline Stages
    stages {

        // Stage: Checkout
        stage('Checkout') {
            steps {
                echo 'Checking out code from the main branch...'
                git branch: 'main', url: 'https://github.com/ishahzaibhaider/Ideofuzion.git'
            }
        }

        // Stage: Install Dependencies
        stage('Install Dependencies') {
            steps {
                echo 'Installing root (server) dependencies...'
                sh 'npm install'
                
                echo 'Installing client dependencies...'
                // CORRECTED: Go into the client folder and install its dependencies
                sh 'cd client && npm install'
            }
        }

        // Stage: Build Application
        stage('Build Application') {
            steps {
                echo 'Building the server...'
                // This builds the server and outputs to the root 'dist' folder
                sh 'npm run build'

                echo 'Building the client UI...'
                // CORRECTED: Go into the client folder and build the UI
                sh 'cd client && npm run build'
            }
        }

        // Stage: Deploy to Production
        stage('Deploy to Production') {
            steps {
                sh '''
                    echo "Deploying new build to the production server..."
                    
                    # --- IMPORTANT ---
                    # Using the private IP of your web server.
                    
                    # Step A: Copy the SERVER build output from the root 'dist' folder
                    scp -r dist/* ubuntu@172.31.80.177:/home/ubuntu/Ideofuzion/dist
                    
                    # Step B: Copy the CLIENT build output from the 'client/dist' folder
                    # This is the step that was missing. It copies your UI.
                    scp -r client/dist/* ubuntu@172.31.80.177:/home/ubuntu/Ideofuzion/dist/public
                    
                    # Step C: Connect and reload the PM2 application
                    ssh ubuntu@172.31.80.177 "pm2 reload ideofuzion-app"

                    echo "Deployment complete."
                '''
            }
        }
    }
}
