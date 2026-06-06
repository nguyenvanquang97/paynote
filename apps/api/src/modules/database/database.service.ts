import {Injectable, OnModuleDestroy} from '@nestjs/common';
import {Pool, QueryResult, QueryResultRow} from 'pg';
import {getConfig} from '../../shared/config';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool = new Pool({
    connectionString: getConfig().databaseUrl,
    ssl: process.env.DATABASE_SSL === 'false' ? false : {rejectUnauthorized: false},
  });

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
