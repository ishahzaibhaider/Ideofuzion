pipeline {
    // 1. Agent and Tools Configuration
    // Run this pipeline on any available Jenkins agent.
    agent any

    // Specify the NodeJS version to use, which must match the name
    // configured in Manage Jenkins > Tools.
    tools {
        nodejs 'NodeJS-24'
    }

    // 2. Pipeline Stages
    // The pipeline is broken down into logical stages.
    stages {

        // Stage: Checkout
        // Clones the source code from the GitHub repository.
        stage('Checkout') {
            steps {
                echo 'Checking out code from the main branch...'
                git branch: 'main', url: 'https://github.com/ishahzaibhaider/Ideofuzion.git'
                // Note: Replace the URL with your actual repository URL.
            }
        }

        // Stage: Install Dependencies
        // Installs the required Node.js packages using npm.
        stage('Install Dependencies') {
            steps {
                echo 'Installing npm project dependencies...'
                sh 'npm install'
            }
        }

        // Stage: Build Application
        // Creates a production-ready build of the application.
        // The output is typically placed in a 'build' or 'dist' folder.
        stage('Build Application') {
            steps {
                echo 'Creating a production build...'
                sh 'npm run build'
            }
        }

        // Stage: Deploy to Production
        // Copies the built files to the web server and restarts the
        // application using PM2 for a zero-downtime update.
        stage('Deploy to Production') {
            steps {
                sh '''
                    echo "Deploying new build to the production server..."
                    
                    # --- IMPORTANT ---
                    # Replace 'your_web_server_ip' with your EC2 instance's public IP address.
                    
                    # Step A: Securely copy the contents of the 'build' folder to the web server.
                    # The destination path '/home/ubuntu/Ideofuzion' was identified from your pm2 output.
                    scp -r build/* ubuntu@172.31.80.177/:/home/ubuntu/Ideofuzion
                    
                    # Step B: Connect to the web server and gracefully reload the PM2 application.
                    # The app name 'ideofuzion-app' was identified from your pm2 output.
                    ssh ubuntu@172.31.80.177/ "pm2 reload ideofuzion-app"

                    echo "Deployment complete."
                '''
            }
        }
    }
}
