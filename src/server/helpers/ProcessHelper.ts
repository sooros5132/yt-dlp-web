import { qualityToYtDlpCmdOptions } from '@/lib/utils';
import { SelectQuality } from '@/types/video';
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

  async isRunningAsYtdlpProcess(url: string, format: string, selectQuality?: SelectQuality) {
    try {
      const executedCommand = await this.getCommandLineWithNullCharactersRemoved();

      if (
        //! array includes로 하면 작동안됨.
        //! Should not be changed to ['/usr/bin/yt-dlp', '/usr/local/bin/yt-dlp'].includes(executedCommand)
        (!executedCommand.includes('/usr/bin/yt-dlp') &&
          !executedCommand.includes('/usr/local/bin/yt-dlp')) ||
        !executedCommand.includes(url)
      ) {
        return false;
      }
      if (selectQuality) {
        const cmdOptions = qualityToYtDlpCmdOptions(selectQuality);
        for (const option of cmdOptions) {
          if (!executedCommand.includes(option)) {
            return false;
          }
        }
      } else {
        if (!executedCommand.includes(format)) {
          return false;
        }
      }
      console.log(true);

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * \x00(binary null) 문자를 지운 명령줄을 리턴함.
   */
  private async getCommandLineWithNullCharactersRemoved() {
    const cmdline = await this.getCommandLine();

    return cmdline.replace(/\x00/g, '');
  }

  private async getCommandLine() {
    const process = spawn('cat', [`/proc/${this.pid}/cmdline`], {
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
