// Jenkinsfile

/**
 * This pipeline automates the deployment of the Ideofuzion application.
 * It builds the entire application and ensures a clean deployment to the server.
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
                sh 'cd client && npm install'
            }
        }

        // Stage: Build Application
        stage('Build Application') {
            steps {
                echo 'Building the application (client and server)...'
                // CORRECTED: This single command builds everything needed into the root 'dist' folder.
                sh 'npm run build'
            }
        }

        // Stage: Deploy to Production
        stage('Deploy to Production') {
            steps {
                sh '''
                    echo "Deploying new build to the production server..."
                    
                    # --- IMPORTANT ---
                    # Using the private IP of your web server.
                    
                    # Step A: Clean up the old build on the remote server to prevent stale files.
                    ssh ubuntu@172.31.80.177 "rm -rf /home/ubuntu/Ideofuzion/dist && mkdir /home/ubuntu/Ideofuzion/dist"
                    
                    # Step B: Copy the new, unified build output to the remote server.
                    scp -r dist/* ubuntu@172.31.80.177:/home/ubuntu/Ideofuzion/dist/
                    
                    # Step C: Connect and reload the PM2 application.
                    ssh ubuntu@172.31.80.177 "pm2 reload ideofuzion-app"

                    echo "Deployment complete."
                '''
            }
        }
    }
}
