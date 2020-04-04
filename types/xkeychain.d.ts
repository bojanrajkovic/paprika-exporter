declare module "xkeychain" {
    interface SetPasswordOptions {
        account: string,
        service: string,
        password: string,
        type: string
    }

    interface GetPasswordOptions {
        account: string,
        service: string,
        type: string
    }

    type DeletePasswordOptions = GetPasswordOptions

    function setPassword(options: SetPasswordOptions, callback: (err: Error) => void): void 
    function getPassword(options: GetPasswordOptions, callback: (err: Error, password: string) => void): void
    function deletePassword(options: DeletePasswordOptions, callback: (err: Error) => void): void
}