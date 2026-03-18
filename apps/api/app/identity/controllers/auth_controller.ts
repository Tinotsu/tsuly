import { HttpContext } from '@adonisjs/core/http'

import { loginValidator, signupValidator } from '../validators/user.ts'
import UserTransformer from '../transformers/user_transformer.ts'
import User from '../models/user.ts'

export default class AuthController {
  async register({ request, auth }: HttpContext) {
    const payload = await request.validateUsing(signupValidator)
    const user = await User.create({ ...payload })

    await auth.use('web').login(user)
  }

  async login({ request, auth }: HttpContext) {
    const payload = await request.validateUsing(loginValidator)
    const user = await User.verifyCredentials(payload.email, payload.password)

    await auth.use('web').login(user)
  }

  async logout({ auth }: HttpContext) {
    await auth.use('web').logout()
  }

  async getMe({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()

    return await serialize.withoutWrapping(UserTransformer.transform(user))
  }

  async isAuthenticated({ auth }: HttpContext) {
    return { isAuthenticated: !!auth.user }
  }
}
