<div class="container generate">
    <div class="columns">
        <div class="column">
            <div class="panel">
                <div class="panel-header text-center">
                    <figure class="avatar avatar-lg" data-initial="T"></figure>
                    <div class="panel-title h5 mt-10">{{name}}</div>
                    <div class="panel-subtitle">{{description}}</div>
                </div>
                <div class="panel-body">
                    <form id="jsonSchema">
                        {{#properties}}
                            <div class="form-group">
                                <label class="form-label">{{name}}</label>
                                {{#isEnum}}
                                    <select class="form-select schema-field" name="{{name}}">
                                    {{#possibleValues}}
                                        <option>{{.}}</option>
                                    {{/possibleValues}}
                                    </select>                                    
                                {{/isEnum}}
                                {{^isEnum}}
                                    {{#isBoolean}}
                                        <label class="form-switch">
                                            <input type="checkbox" name="{{name}}" class="schema-field">
                                            <i class="form-icon"></i> Enabled
                                        </label>
                                    {{/isBoolean}}
                                    {{^isBoolean}}
                                        <input class="form-input schema-field" type="text" placeholder="{{description}}" name="{{name}}">
                                    {{/isBoolean}}
                                {{/isEnum}}
                            </div>
                        {{/properties}}
                    </form>
                </div>
                <div class="panel-footer"></div>
            </div>      
        </div>
        <div class="column">
            <div class="panel">
                <div class="panel-body" id="generatedJson">
            </div>      
        </div>
    </div>
</div>