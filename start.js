#!/usr/bin/env node

/**
 * Air Quality Monitoring System - Production Startup Script
 * 
 * This script handles the complete initialization and startup of the
 * air quality monitoring application with proper dependency checking,
 * configuration validation, and graceful error handling.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class StartupManager {
    constructor() {
        this.requiredDirectories = [
            'logs',
            'data/uploads',
            'data/exports', 
            'data/state',
            'config'
        ];
        
        this.requiredFiles = [
            '.env',
            'package.json',
            'server.js'
        ];
    }

    async initialize() {
        console.log('🚀 Starting Air Quality Monitoring System...\n');
        
        try {
            await this.checkSystemRequirements();
            await this.createDirectories();
            await this.validateConfiguration();
            await this.installDependencies();
            await this.buildFrontend();
            await this.startApplication();
        } catch (error) {
            console.error('❌ Startup failed:', error.message);
            process.exit(1);
        }
    }

    async checkSystemRequirements() {
        console.log('🔍 Checking system requirements...');
        
        // Check Node.js version
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
        
        if (majorVersion < 16) {
            throw new Error(`Node.js 16+ required, current version: ${nodeVersion}`);
        }
        
        console.log(`✅ Node.js ${nodeVersion} detected`);
        
        // Check for required files
        for (const file of this.requiredFiles) {
            if (!fs.existsSync(file)) {
                throw new Error(`Required file missing: ${file}`);
            }
        }
        
        console.log('✅ Required files present');
    }

    async createDirectories() {
        console.log('📁 Creating required directories...');
        
        for (const dir of this.requiredDirectories) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`  Created: ${dir}`);
            }
        }
        
        console.log('✅ Directory structure ready');
    }

    async validateConfiguration() {
        console.log('⚙️ Validating configuration...');
        
        // Check for .env file, create from template if missing
        if (!fs.existsSync('.env')) {
            if (fs.existsSync('.env.example')) {
                fs.copyFileSync('.env.example', '.env');
                console.log('📋 Created .env from template - please configure your API keys');
            } else {
                throw new Error('.env file missing and no .env.example found');
            }
        }
        
        // Load and validate environment variables
        require('dotenv').config();
        
        const requiredEnvVars = [
            'THINGSPEAK_READ_API_KEY',
            'THINGSPEAK_CHANNEL_ID'
        ];
        
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            console.warn('⚠️ Missing environment variables:', missingVars.join(', '));
            console.warn('   Application will run in demo mode with mock data');
        }
        
        console.log('✅ Configuration validated');
    }

    async installDependencies() {
        console.log('📦 Installing dependencies...');
        
        try {
            // Install backend dependencies
            if (!fs.existsSync('node_modules')) {
                console.log('  Installing backend packages...');
                execSync('npm install', { stdio: 'inherit' });
            }
            
            // Install frontend dependencies
            if (fs.existsSync('frontend') && !fs.existsSync('frontend/node_modules')) {
                console.log('  Installing frontend packages...');
                execSync('npm install', { 
                    cwd: 'frontend',
                    stdio: 'inherit' 
                });
            }
            
            console.log('✅ Dependencies installed');
        } catch (error) {
            throw new Error(`Dependency installation failed: ${error.message}`);
        }
    }

    async buildFrontend() {
        console.log('🏗️ Building frontend...');
        
        if (fs.existsSync('frontend')) {
            try {
                execSync('npm run build', { 
                    cwd: 'frontend',
                    stdio: 'inherit' 
                });
                
                // Copy built frontend to public directory
                if (fs.existsSync('frontend/dist')) {
                    if (fs.existsSync('public')) {
                        fs.rmSync('public', { recursive: true, force: true });
                    }
                    fs.cpSync('frontend/dist', 'public', { recursive: true });
                    console.log('✅ Frontend built and deployed');
                } else {
                    console.warn('⚠️ Frontend build directory not found, using existing public files');
                }
            } catch (error) {
                console.warn('⚠️ Frontend build failed, application will serve static files only');
                console.warn('   Error:', error.message);
            }
        } else {
            console.log('ℹ️ Frontend directory not found, serving static files only');
        }
    }

    async startApplication() {
        console.log('🚀 Starting application server...');
        
        // Set production environment if not specified
        if (!process.env.NODE_ENV) {
            process.env.NODE_ENV = 'production';
        }
        
        // Start the main application
        try {
            require('./server.js');
        } catch (error) {
            throw new Error(`Application startup failed: ${error.message}`);
        }
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the application
if (require.main === module) {
    const startup = new StartupManager();
    startup.initialize();
}

module.exports = StartupManager;