import {
    estypes 
} from "@elastic/elasticsearch"

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
