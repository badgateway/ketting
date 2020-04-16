import { BaseState, StateFactory } from '../state';

/**
 * This factory creates a State object for text responses, such as
 * text/html, text/csv.
 */
export const factory: StateFactory<string> = async (response: Response): Promise<TextState> => {

  return new TextState(
    await response.text(),
    response.headers
  );

}

export class TextState extends BaseState<string> {

  serializeBody(): string {

    return this.body;

  }

}
