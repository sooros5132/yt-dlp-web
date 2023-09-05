import { spawn } from 'child_process';

export class ProcessHelper {
  private readonly pid;

  constructor(params: { pid: number }) {
    this.pid = params.pid;
  }

  /**
   *
   * @param code SIGCODE
   *
   * 1	= SIGHUP							종료(연결끊기, 실행종료)
   *
   * 2	= SIGINT		CTRL + C	종료(, 인터럽트)
   *
   * 3	= SIGQUIT		CTRL + \	종료+코어 덤프
   *
   * 9	=	SIGKILL							강제종료(클린업 핸들러 불가능)
   *
   * 15	=	SIGTERM							정상종료
   *
   * 18	= SIGCONT							정리된 프로세스 재실행
   *
   * 19	=	SIGSTOP							정지(클린업 핸들러 불가능)
   *
   * 20	= SIGTSTP		CTRL + Z	정지
   */
  // 2와 15 사용을 추천, 9번은 클린업 코드가 실행 안된다.
  async kill(code = 2) {
    spawn('kill', [`-${code}`, String(this.pid)]).on('exit', () => {
      console.log(`stopped process \`${this.pid}\``);
    });
  }

  async isRunningAsYtdlpProcess(url: string, format: string) {
    try {
      const executedCommand = await this.getCommandLine();
      if (
        executedCommand.includes('/usr/bin/yt-dlp') &&
        executedCommand.includes(url) &&
        executedCommand.includes(`-f ${format}`)
      ) {
        return true;
      }
      throw '';
    } catch (e) {
      return false;
    }
  }

  async getCommandLine() {
    const process = spawn('cat', [`/proc/${this.pid}/cmdline`, '|', 'tr', "'\\000'", "' '"], {
      shell: true
    });

    let stdoutChunks = '';

    process.stdout.setEncoding('utf-8');
    process.stdout.on('data', (data) => {
      const text = data?.trim?.();
      if (text) stdoutChunks += text;
    });

    return new Promise((resolve: (command: string) => void, reject: (message: string) => void) => {
      process.stderr.setEncoding('utf-8');
      process.stderr.on('data', (data) => {
        return reject(data?.trim?.() || '');
      });
      process.on('exit', () => {
        try {
          if (!stdoutChunks) {
            throw 'No such process';
          }
          resolve(stdoutChunks);
        } catch (e) {
          reject('No such process');
        }
      });
    });
  }
}
