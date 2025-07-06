# Infrastructure and Deployment Research

*Research Date: January 2025*  
*Status: Complete*

## Executive Summary

This research explores modern infrastructure and deployment patterns for AI-assisted development applications, focusing on Docker Compose orchestration, Redis caching strategies, PostgreSQL optimization, Google OAuth integration, environment management, and comprehensive monitoring solutions. The findings emphasize containerized architectures with intelligent caching layers and robust observability.

## Table of Contents

1. [Docker Compose Best Practices](#docker-compose-best-practices)
2. [Redis Caching for AI Applications](#redis-caching-for-ai-applications)
3. [PostgreSQL Optimization](#postgresql-optimization)
4. [Google OAuth Integration](#google-oauth-integration)
5. [Environment Management](#environment-management)
6. [Monitoring and Observability](#monitoring-and-observability)
7. [Architecture Patterns](#architecture-patterns)
8. [Security Considerations](#security-considerations)
9. [Performance Optimization](#performance-optimization)
10. [CI/CD Integration](#cicd-integration)
11. [Common Pitfalls](#common-pitfalls)
12. [Future Considerations](#future-considerations)

## Docker Compose Best Practices

### Multi-Stage Builds for AI Applications

Modern AI applications benefit from optimized Docker images using multi-stage builds:

```yaml
# Example for AI chatbot application
version: '3.9'

services:
  ai-chatbot:
    build:
      context: .
      dockerfile: Dockerfile.multi-stage
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://user:pass@postgres:5432/db
    depends_on:
      - redis
      - postgres
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    networks:
      - app-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=chatbot
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

volumes:
  redis_data:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

### Service Organization Patterns

**Modular Service Design:**
- Each service should have a single responsibility
- Use named volumes for data persistence
- Implement health checks for reliability
- Define explicit networks for service isolation

**Resource Management:**
```yaml
services:
  ai-backend:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: "1.5"
        reservations:
          memory: 1G
          cpus: "0.5"
```

### Environment-Specific Configurations

**Development vs Production:**
```yaml
# docker-compose.override.yml (development)
services:
  app:
    volumes:
      - .:/app
    environment:
      - DEBUG=true
    ports:
      - "3000:3000"

# docker-compose.prod.yml (production)
services:
  app:
    restart: unless-stopped
    environment:
      - DEBUG=false
    labels:
      - "traefik.enable=true"
```

## Redis Caching for AI Applications

### LLM Response Caching

Redis serves as a critical caching layer for AI applications, particularly for LLM responses:

**Semantic Caching Implementation:**
```javascript
// Semantic cache for LLM responses
class SemanticCache {
  constructor(redisClient) {
    this.redis = redisClient;
    this.embeddingModel = new EmbeddingModel();
  }

  async getCachedResponse(query) {
    const embedding = await this.embeddingModel.encode(query);
    const similarQueries = await this.redis.call(
      'FT.SEARCH', 
      'query_index', 
      `*=>[KNN 5 @embedding $query_vec]`,
      'PARAMS', '2', 'query_vec', embedding,
      'RETURN', '2', 'response', 'similarity'
    );
    
    if (similarQueries[0] > 0 && similarQueries[2] > 0.95) {
      return similarQueries[3]; // Return cached response
    }
    return null;
  }

  async cacheResponse(query, response) {
    const embedding = await this.embeddingModel.encode(query);
    const key = `query:${Date.now()}`;
    await this.redis.hset(key, {
      query,
      response,
      embedding: Buffer.from(embedding),
      timestamp: Date.now()
    });
  }
}
```

### Session Management for Chat Applications

**Optimized Session Storage:**
```yaml
redis:
  image: redis:7-alpine
  command: >
    redis-server 
    --maxmemory 1gb 
    --maxmemory-policy allkeys-lru
    --save 900 1
    --appendonly yes
    --appendfsync everysec
```

**Session Configuration:**
```javascript
// Session management with Redis
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

### Rate Limiting for AI APIs

**Intelligent Rate Limiting:**
```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const aiApiLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'ai_api_limit:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Dynamic limits based on user tier
    return req.user?.tier === 'premium' ? 1000 : 100;
  },
  message: {
    error: 'Too many AI requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
```

## PostgreSQL Optimization

### Configuration for AI Workloads

**Optimized PostgreSQL Settings:**
```sql
-- postgresql.conf optimizations for AI applications
shared_buffers = '256MB'
effective_cache_size = '1GB'
work_mem = '16MB'
maintenance_work_mem = '64MB'
checkpoint_completion_target = 0.9
wal_buffers = '16MB'
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

-- For vector similarity searches
max_parallel_workers_per_gather = 2
max_parallel_workers = 8
```

### Vector Extensions for AI

**pgvector Setup:**
```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table for embeddings
CREATE TABLE document_embeddings (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI embedding dimension
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for similarity search
CREATE INDEX ON document_embeddings 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Similarity search query
SELECT content, 1 - (embedding <=> $1) AS similarity
FROM document_embeddings
WHERE 1 - (embedding <=> $1) > 0.8
ORDER BY embedding <=> $1
LIMIT 10;
```

### Connection Pooling

**PgBouncer Configuration:**
```ini
[databases]
chatbot_db = host=postgres port=5432 dbname=chatbot user=app_user

[pgbouncer]
pool_mode = transaction
listen_port = 6432
listen_addr = *
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
logfile = /var/log/pgbouncer/pgbouncer.log
pidfile = /var/run/pgbouncer/pgbouncer.pid
admin_users = admin
max_client_conn = 200
default_pool_size = 25
server_reset_query = DISCARD ALL
```

## Google OAuth Integration

### Next.js 15 Implementation

**Modern OAuth Setup:**
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token, user }) {
      // Enhance session with user data
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    }
  },
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  }
});

export { handler as GET, handler as POST };
```

### Security Best Practices

**CSRF Protection:**
```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Add security headers
    const response = NextResponse.next();
    
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    );
    
    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect API routes
        if (req.nextUrl.pathname.startsWith('/api/protected')) {
          return !!token;
        }
        return true;
      }
    }
  }
);

export const config = {
  matcher: ['/api/protected/:path*', '/dashboard/:path*']
};
```

## Environment Management

### Multi-Environment Strategy

**Environment Configuration:**
```yaml
# docker-compose.yml
version: '3.9'

services:
  app:
    build:
      context: .
      target: ${BUILD_TARGET:-production}
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    env_file:
      - .env.${NODE_ENV:-production}
    volumes:
      - ${VOLUME_MOUNT:-/app/data}:/app/data
    networks:
      - ${NETWORK_NAME:-app-network}
```

**Environment-Specific Overrides:**
```bash
# .env.development
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://dev:dev@localhost:5432/chatbot_dev

# .env.staging
NODE_ENV=staging
DEBUG=false
LOG_LEVEL=info
REDIS_URL=redis://redis-staging:6379
DATABASE_URL=postgresql://staging:pass@postgres-staging:5432/chatbot_staging

# .env.production
NODE_ENV=production
DEBUG=false
LOG_LEVEL=warn
REDIS_URL=redis://redis-prod:6379
DATABASE_URL=postgresql://prod:secure@postgres-prod:5432/chatbot_prod
```

### Secret Management

**Docker Secrets Integration:**
```yaml
services:
  app:
    secrets:
      - db_password
      - api_key
    environment:
      - DATABASE_PASSWORD_FILE=/run/secrets/db_password
      - API_KEY_FILE=/run/secrets/api_key

secrets:
  db_password:
    file: ./secrets/db_password.txt
  api_key:
    external: true
    name: production_api_key
```

## Monitoring and Observability

### OpenTelemetry Integration

**Comprehensive Observability Setup:**
```typescript
// lib/telemetry.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'ai-chatbot',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development'
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-redis': {
        enabled: true,
        requestHook: (span, request) => {
          span.setAttributes({
            'redis.command': request.command,
            'redis.key': request.args?.[0]
          });
        }
      },
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        requestHook: (span, request) => {
          span.setAttributes({
            'http.route': request.url,
            'user.id': request.headers['x-user-id']
          });
        }
      }
    })
  ],
  traceExporter: new JaegerExporter({
    endpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger:14268/api/traces'
  }),
  metricReader: new PrometheusExporter({
    port: 9090,
    endpoint: '/metrics'
  })
});

sdk.start();
```

### AI-Specific Metrics

**LLM Performance Monitoring:**
```typescript
// lib/ai-metrics.ts
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('ai-chatbot');

const llmLatencyHistogram = meter.createHistogram('llm_request_duration', {
  description: 'LLM request duration in milliseconds',
  unit: 'ms'
});

const llmTokenCounter = meter.createCounter('llm_tokens_processed', {
  description: 'Total tokens processed by LLM'
});

const cacheHitCounter = meter.createCounter('cache_hits', {
  description: 'Number of cache hits'
});

export class AIMetrics {
  static recordLLMLatency(duration: number, model: string, success: boolean) {
    llmLatencyHistogram.record(duration, {
      model,
      success: success.toString()
    });
  }

  static recordTokenUsage(inputTokens: number, outputTokens: number, model: string) {
    llmTokenCounter.add(inputTokens, {
      type: 'input',
      model
    });
    llmTokenCounter.add(outputTokens, {
      type: 'output',
      model
    });
  }

  static recordCacheHit(hit: boolean, type: string) {
    cacheHitCounter.add(1, {
      hit: hit.toString(),
      type
    });
  }
}
```

### Prometheus and Grafana Setup

**Monitoring Stack:**
```yaml
# monitoring/docker-compose.yml
version: '3.9'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"
      - "14268:14268"
    environment:
      - COLLECTOR_OTLP_ENABLED=true

volumes:
  prometheus_data:
  grafana_data:
```

**Prometheus Configuration:**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'ai-chatbot'
    static_configs:
      - targets: ['app:9090']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

## Architecture Patterns

### Microservices with AI Components

**Service Decomposition:**
```yaml
# AI-enhanced microservices architecture
version: '3.9'

services:
  # API Gateway
  gateway:
    build: ./gateway
    ports:
      - "3000:3000"
    environment:
      - RATE_LIMIT_REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      - auth-service
      - chat-service

  # Authentication Service
  auth-service:
    build: ./services/auth
    environment:
      - DATABASE_URL=postgresql://auth:pass@postgres:5432/auth_db
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  # Chat Service with LLM Integration
  chat-service:
    build: ./services/chat
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - VECTOR_DB_URL=postgresql://chat:pass@postgres:5432/vector_db
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: "2.0"

  # Vector Search Service
  vector-service:
    build: ./services/vector
    environment:
      - EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
      - POSTGRES_URL=postgresql://vector:pass@postgres:5432/vector_db
    depends_on:
      - postgres

  # Shared Infrastructure
  postgres:
    image: pgvector/pgvector:pg15
    environment:
      - POSTGRES_MULTIPLE_DATABASES=auth_db,chat_db,vector_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 1gb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Event-Driven Architecture

**Redis Streams for AI Events:**
```typescript
// Event-driven AI processing
class AIEventProcessor {
  constructor(redisClient) {
    this.redis = redisClient;
    this.consumerGroup = 'ai-processors';
  }

  async publishChatEvent(userId: string, message: string, metadata: any) {
    await this.redis.xadd(
      'chat-events',
      '*',
      'userId', userId,
      'message', message,
      'metadata', JSON.stringify(metadata),
      'timestamp', Date.now()
    );
  }

  async processChatEvents() {
    try {
      // Create consumer group if it doesn't exist
      await this.redis.xgroup('CREATE', 'chat-events', this.consumerGroup, '0', 'MKSTREAM');
    } catch (err) {
      // Group already exists
    }

    while (true) {
      const results = await this.redis.xreadgroup(
        'GROUP', this.consumerGroup, 'processor-1',
        'COUNT', 10,
        'BLOCK', 1000,
        'STREAMS', 'chat-events', '>'
      );

      for (const [stream, messages] of results) {
        for (const [id, fields] of messages) {
          await this.processMessage(id, fields);
          await this.redis.xack('chat-events', this.consumerGroup, id);
        }
      }
    }
  }

  async processMessage(id: string, fields: string[]) {
    const data = this.parseFields(fields);
    
    // Process with AI
    const response = await this.generateAIResponse(data.message);
    
    // Cache the response
    await this.cacheResponse(data.userId, data.message, response);
    
    // Emit processed event
    await this.publishProcessedEvent(data.userId, response);
  }
}
```

## Security Considerations

### Container Security

**Security Hardening:**
```dockerfile
# Multi-stage build with security focus
FROM node:18-alpine AS base
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

# Security: Run as non-root user
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

**Security Scanning:**
```yaml
# Security scanning in CI/CD
security-scan:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: 'myapp:latest'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'
```

### Network Security

**Network Isolation:**
```yaml
networks:
  frontend:
    driver: bridge
    internal: false
  backend:
    driver: bridge
    internal: true
  database:
    driver: bridge
    internal: true

services:
  gateway:
    networks:
      - frontend
      - backend
  
  app:
    networks:
      - backend
      - database
  
  postgres:
    networks:
      - database
```

## Performance Optimization

### Caching Strategies

**Multi-Layer Caching:**
```typescript
// Intelligent caching hierarchy
class CacheManager {
  constructor() {
    this.l1Cache = new Map(); // In-memory
    this.l2Cache = redisClient; // Redis
    this.l3Cache = postgresClient; // Database
  }

  async get(key: string): Promise<any> {
    // L1: Memory cache
    if (this.l1Cache.has(key)) {
      return this.l1Cache.get(key);
    }

    // L2: Redis cache
    const redisValue = await this.l2Cache.get(key);
    if (redisValue) {
      this.l1Cache.set(key, JSON.parse(redisValue));
      return JSON.parse(redisValue);
    }

    // L3: Database
    const dbValue = await this.l3Cache.query('SELECT data FROM cache WHERE key = $1', [key]);
    if (dbValue.rows.length > 0) {
      const value = dbValue.rows[0].data;
      await this.set(key, value, 3600); // Cache for 1 hour
      return value;
    }

    return null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    // Set in all cache layers
    this.l1Cache.set(key, value);
    await this.l2Cache.setex(key, ttl, JSON.stringify(value));
    
    // Optionally persist to database for cold cache scenarios
    await this.l3Cache.query(
      'INSERT INTO cache (key, data, expires_at) VALUES ($1, $2, $3) ON CONFLICT (key) DO UPDATE SET data = $2, expires_at = $3',
      [key, value, new Date(Date.now() + ttl * 1000)]
    );
  }
}
```

### Resource Optimization

**Intelligent Resource Allocation:**
```yaml
services:
  ai-service:
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: "2.0"
        reservations:
          memory: 2G
          cpus: "1.0"
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## CI/CD Integration

### Automated Deployment Pipeline

**GitHub Actions Workflow:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: |
          docker build -t myapp:${{ github.sha }} .
          docker tag myapp:${{ github.sha }} myapp:latest
      
      - name: Deploy with Docker Compose
        run: |
          echo "DOCKER_TAG=${{ github.sha }}" > .env.production
          docker-compose -f docker-compose.prod.yml up -d
      
      - name: Health check
        run: |
          timeout 60 bash -c 'until curl -f http://localhost:3000/health; do sleep 2; done'
```

## Common Pitfalls

### Resource Management Issues

1. **Memory Leaks in Containers**
   - Implement proper garbage collection
   - Monitor memory usage patterns
   - Set appropriate memory limits

2. **Database Connection Exhaustion**
   - Use connection pooling
   - Implement proper connection lifecycle management
   - Monitor connection metrics

3. **Cache Invalidation Problems**
   - Implement proper TTL strategies
   - Use cache versioning
   - Monitor cache hit rates

### Security Vulnerabilities

1. **Exposed Secrets**
   - Use Docker secrets or external secret management
   - Never commit secrets to version control
   - Implement secret rotation

2. **Insecure Network Configuration**
   - Use internal networks for service communication
   - Implement proper firewall rules
   - Use TLS for all external communication

## Future Considerations

### Emerging Technologies

1. **WebAssembly (WASM) for AI Models**
   - Portable AI model execution
   - Reduced cold start times
   - Better resource utilization

2. **Edge Computing Integration**
   - Distributed AI processing
   - Reduced latency for users
   - Local data processing

3. **Kubernetes Migration Path**
   - Container orchestration at scale
   - Advanced deployment strategies
   - Service mesh integration

### Scalability Planning

1. **Horizontal Scaling Strategies**
   - Load balancer configuration
   - Database sharding
   - Cache distribution

2. **Performance Monitoring Evolution**
   - AI-driven anomaly detection
   - Predictive scaling
   - Cost optimization

## Conclusion

Modern infrastructure for AI-assisted development applications requires a sophisticated approach combining containerization, intelligent caching, robust databases, secure authentication, and comprehensive monitoring. The patterns and practices outlined in this research provide a foundation for building scalable, maintainable, and secure AI applications.

Key takeaways:
- Docker Compose provides excellent orchestration for development and small-scale production
- Redis serves as a critical caching layer for AI applications, especially for LLM responses
- PostgreSQL with vector extensions offers powerful capabilities for AI workloads
- Comprehensive monitoring with OpenTelemetry, Prometheus, and Grafana is essential
- Security must be built into every layer of the infrastructure
- Performance optimization through multi-layer caching and resource management is crucial

The infrastructure patterns presented here support the rapid development and deployment of AI-enhanced applications while maintaining production-grade reliability and security standards.

---

*This research provides a comprehensive foundation for infrastructure and deployment decisions in AI-assisted development projects. Regular updates should be made as technologies and best practices evolve.* 