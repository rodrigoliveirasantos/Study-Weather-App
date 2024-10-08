import { Component, inject, OnDestroy } from '@angular/core';
import { WeatherService } from '../../services/weather/weather.service';
import { combineLatest, filter, map, merge, Observable, share, shareReplay, startWith, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { GeolocationService } from '../../services/geolocation/geolocation.service';
import { GeolocationGetPositionResult } from 'src/app/models/classes/GeolocationGetPositionResult';
import { faLocation, faLocationPin, faMapPin } from '@fortawesome/free-solid-svg-icons';
import { WeatherReport } from 'src/app/models/interface/weather';
import { WeatherConditionTypes } from '../../types';

@Component({
  selector: 'app-weather-home',
  templateUrl: './weather-home.component.html',
  styleUrls: ["./weather-home.component.scss"]
})
export class WeatherHomeComponent implements OnDestroy {
  readonly notFoundErrorMsg = 'Não foram encontradas dados nesta região. Verifique se o nome está correto ou busque por uma outra cidade próxima.';
  readonly positionPermissionErrorMsg = 'Não há permissões para buscar sua localização. Conceda permissão para acessar o local e tente novamente.';
  readonly positionUnavailableErrorMsg = 'O sinal de GPS não consegue alcançar sua posição no momento.'
  readonly positionMissingErrorMsg = 'O seu dispositivo não suporta busca a partir do GPS.';

  readonly positionIcon = faLocationPin;

  private _weatherService = inject(WeatherService);
  private _geolocationService = inject(GeolocationService);

  cityName = '';

  submit$ = new Subject<string>();
  coordsBtnEvent$ = new Subject<void>();

  position$ = this.coordsBtnEvent$.pipe(
    switchMap(() => this.getPosition()),
    share()
  );

  weatherDataQuery$ = merge(
    this.submit$.pipe(map((cityName) => {
      return { cityName }
    })),
    this.position$.pipe(
      filter((position) => position.success),
      map(({ latlon }) => {
        return { latlon }
      })
    )
  )

  weatherData$ = this.weatherDataQuery$.pipe(
    switchMap((query) => {
      return this._weatherService.getWeatherData(query);
    }),
    shareReplay(1)
  );

  error$ = merge(
    this.weatherData$.pipe(
      map((data) => data ? '' : this.notFoundErrorMsg)
    ),

    this.position$.pipe(
      filter((position) => !position.success),
      map(({ code }) => {
        return this.getPossitionErrorMessage(code)
      })
    )
  )

  condition$: Observable<WeatherConditionTypes> = merge(
    this.error$.pipe(map(() => WeatherConditionTypes.None)),
    this.weatherData$.pipe(map((report) => this.getCondition(report)))
  );

  loadingWeatherData$ = merge(
    this.weatherDataQuery$.pipe(map(() => true)),
    this.weatherData$.pipe(map(() => false))
  );

  vm$ = combineLatest({
    weatherData: this.weatherData$.pipe(startWith(false as const)),
    loading: this.loadingWeatherData$.pipe(startWith(false)),
    error: this.error$.pipe(startWith('')),
    condition: this.condition$.pipe(startWith(WeatherConditionTypes.None))
  });

  handleCoordsBtnClick() {
    this.coordsBtnEvent$.next();
  }

  handleSubmit() {
    console.log(this.cityName)
    this.submit$.next(this.cityName);
  }

  getPosition() {
    return this._geolocationService.getPosition().pipe(
      takeUntil(this.submit$),
      map((position) => {
        return position
      }),
    )
  }

  getPossitionErrorMessage(code: number) {
    switch (code) {
      case (GeolocationGetPositionResult.codes.PERMISSION_DENIED): return this.positionPermissionErrorMsg;
      case (GeolocationGetPositionResult.codes.POSITION_UNAVAILABLE): return this.positionUnavailableErrorMsg;
      default: return this.positionMissingErrorMsg;
    }
  }

  getCondition(report: WeatherReport | false): WeatherConditionTypes {
    if (!report) {
      return WeatherConditionTypes.None;
    }

    switch (report.weather[0].main) {
      case 'Ash':
      case 'Fog':
      case 'Mist':
      case 'Dust':
      case 'Sand':
      case 'Smoke':
        return WeatherConditionTypes.Fog;

      case 'Clouds':
        return WeatherConditionTypes.Clouds;

      case 'Rain':
      case 'Drizzle':
        return WeatherConditionTypes.Rain;

      case 'Snow':
        return WeatherConditionTypes.Snow;

      case 'Thunderstorm':
      case 'Squall':
        return WeatherConditionTypes.Thunderstorm;

      case 'Clear':
      case 'Tornado':
      default:
        return WeatherConditionTypes.Clear;
    }
  }

  ngOnDestroy(): void {
    this.submit$.complete();
  }
}
