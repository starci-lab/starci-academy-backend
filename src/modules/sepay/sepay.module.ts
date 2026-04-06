import { DynamicModule, Module } from '@nestjs/common';
import {
  ConfigurableModuleClass,
  OPTIONS_TYPE,
} from './sepay.module-definition';
import { createSepayProvider } from './sepay.providers';

@Module({})
export class SepayModule extends ConfigurableModuleClass {
  static register(options: typeof OPTIONS_TYPE): DynamicModule {
    const dynamicModule = super.register(options);
    const sepaySdkProvider = createSepayProvider();
    return {
      ...dynamicModule,
      providers: [...(dynamicModule.providers ?? []), sepaySdkProvider],
      exports: [sepaySdkProvider],
    };
  }
}
