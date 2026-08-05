import {
    estypes 
} from "@elastic/elasticsearch"

/**
 * Thin wrapper around an ES `search` body so callers pass one object instead of
 * repeating optional `query`/`sort`/`from`/`size`/`highlight`/`_source` at every call.
 */
export interface SearchParam {
  /** The query. */
  query: estypes.SearchRequest["query"];
  /** The sort. */
  sort?: estypes.SearchRequest["sort"];
  /** The from. */
  from?: number;
  /** The size. */
  size?: number;
  /** The highlight. */
  highlight?: estypes.SearchRequest["highlight"];
  /** The _source. */
  _source?: estypes.SearchRequest["_source"];
}
