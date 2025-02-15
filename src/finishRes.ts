import { ValidatableResponse } from "./types";
import { FormattedSubmitResponse } from "ripple-lib/dist/npm/transaction/submit";
import { Prepare } from "ripple-lib/dist/npm/transaction/types";
import { debuglog } from "util";
import { ERRORS } from "./errors";

const log = debuglog('paths');

interface ErrorsResponse {
  errors: Error[];
}

// Simply logs result of validation to debug output
const validate = (res: ValidatableResponse, statusCode: number, response: object): void => {
  if (process.env.NODE_ENV != 'production') {
    if (typeof res.validateResponse !== 'function') {
      console.error('TypeError: res.validateResponse is not a function. Check `api-doc.yml`.');
      return;
    }
    const validation = res.validateResponse(statusCode, response);
    if (validation) {
      // red
      log('\x1b[31m%s\x1b[0m', res.req ? res.req.path : '', 'validation:', validation);
    } else {
      // green
      log('\x1b[32m%s\x1b[0m', res.req ? res.req.path : '', 'response validated');
    }
  }
};

// Wrapper around `res` that reformats errors to make them more informative
export function finishRes(res: ValidatableResponse, status: number, json: FormattedSubmitResponse | Prepare | ErrorsResponse | object): void {
  interface MyError {
    name: string;
    message: string;
    code: number;
  }
  function isErrorsResponse(json: FormattedSubmitResponse | Prepare | ErrorsResponse | object): json is ErrorsResponse {
    return (json as ErrorsResponse).errors !== undefined;
  }
  const serializedErrors: MyError[] = [];
  if (isErrorsResponse(json)) {
    json.errors.forEach(error => {
      if (error instanceof Error) {
        serializedErrors.push({
          name: error.name,
          message: error.message.replace(/"/g, "'"),
          code: (error as any).code || ERRORS.CODES.UNSPECIFIED
        });
      } else {
        log('Warning: Got non-Error:', error);
        serializedErrors.push(error);
      }
    });
    json.errors = serializedErrors;
  }
  validate(res, status, json);
  res.status(status).json(json); // INVALID_BEARER_TOKEN -> Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
}
